import Results from "@/components/Results";
import SectionHeading from "@/components/SectionHeading";

export default function ResultsSection() {
  return (
    <section id="ket-qua" className="py-20 lg:py-28">
      <div className="container-x">
        <SectionHeading
          index="04"
          label="Kết quả"
          title="Công bố theo từng vòng"
          lead="Kết quả được cập nhật tại đây sau mỗi vòng thi và gửi qua email tới từng thí sinh."
        />
        <div className="reveal">
          <Results />
        </div>
      </div>
    </section>
  );
}
